import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private priceCache = new Map<string, { data: PriceEstimate; ts: number }>();
  private readonly PRICE_CACHE_TTL = 3600_000;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
      });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — AI features disabled');
    }
  }

  private async chatCompletion(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    maxTokens = 500,
  ): Promise<string> {
    if (!this.isOpenAiAvailable()) {
      return 'Service IA non configuré. Contactez le support.';
    }
    const res = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return res.choices[0]?.message?.content ?? '';
  }

  // ─── Feature 1: Chatbot ───────────────────────────────────────────────

  private isOpenAiAvailable(): boolean {
    return !!this.openai;
  }

  private readonly CHATBOT_SYSTEM = `Tu es l'assistant MONPRO, un service de mise en relation clients-professionnels en Côte d'Ivoire.
Tu aides les clients à décrire leurs besoms et à trouver le bon professionnel.

Règles:
- Réponds en français
- Sois concis (max 3 phrases)
- Si le client décrit un problème, suggère le service correspondant
- Si tu as assez d'infos, propose de créer une demande de service
- Ne invente pas de prix
- Tu peux poser des questions pour mieux cerner le besoin
- Sois amical et professionnel`;

  async chat(
    message: string,
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: this.CHATBOT_SYSTEM },
    ];

    if (conversationHistory) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    try {
      return await this.chatCompletion(messages);
    } catch (err) {
      this.logger.error('Chatbot error', err);
      return "Désolé, j'ai un problème technique. Réessayez dans quelques instants.";
    }
  }

  // ─── Feature 2: AI Matching ───────────────────────────────────────────

  async scoreProfessionals(
    candidates: Array<{
      id: string;
      name: string;
      rating: number;
      completedJobs: number;
      responseTime: string;
      distanceKm: number | null;
      specializations: string[];
    }>,
    context: {
      serviceName: string;
      description: string;
      urgency: string;
      city: string;
    },
  ): Promise<Map<string, number>> {
    if (candidates.length === 0) return new Map();

    const prompt = `Classe ces professionnels pour cette demande de service.

Service demandé: ${context.serviceName}
Description: ${context.description}
Urgence: ${context.urgency}
Ville: ${context.city}

Professionnels:
${candidates.map((c) => `- ${c.name}: rating=${c.rating}/5, jobs=${c.completedJobs}, responseTime=${c.responseTime}, distance=${c.distanceKm ?? 'N/A'}km, specialités=${c.specializations.join(', ')}`).join('\n')}

Retourne UNIQUEMENT un JSON valide: { "scores": { "id_pro": score_de_0_a_100 } }
Pas de texte avant ou après le JSON.`;

    try {
      const raw = await this.chatCompletion(
        [{ role: 'user', content: prompt }],
        800,
      );
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as { scores: Record<string, number> };
      const scores = new Map<string, number>();
      for (const [id, score] of Object.entries(parsed.scores)) {
        scores.set(id, Math.min(100, Math.max(0, Math.round(score))));
      }
      return scores;
    } catch (err) {
      this.logger.warn('AI scoring failed, returning empty map', err);
      return new Map();
    }
  }

  // ─── Feature 3: Price Estimation ──────────────────────────────────────

  async estimatePrice(
    serviceId: string,
    description: string,
    latitude?: number,
    longitude?: number,
  ): Promise<PriceEstimate> {
    const cacheKey = `${serviceId}:${latitude ?? ''}:${longitude ?? ''}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.PRICE_CACHE_TTL) {
      return cached.data;
    }

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        subcategory: { include: { category: true } },
        professionals: { select: { priceMin: true, priceMax: true } },
      },
    });

    const quotes = await this.prisma.quote.findMany({
      where: {
        serviceRequest: { serviceId },
        status: 'ACCEPTED',
      },
      select: { totalAmount: true, laborCost: true, materialCost: true, transportCost: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const priceRange = service?.professionals ?? [];
    const avgMin = priceRange.length > 0
      ? priceRange.reduce((s, p) => s + (p.priceMin ?? 0), 0) / priceRange.length
      : 0;
    const avgMax = priceRange.length > 0
      ? priceRange.reduce((s, p) => s + (p.priceMax ?? 0), 0) / priceRange.length
      : 0;

    const avgQuote = quotes.length > 0
      ? quotes.reduce((s, q) => s + q.totalAmount, 0) / quotes.length
      : 0;

    const prompt = `Estime le prix pour ce service en Côte d'Ivoire.

Service: ${service?.subcategory?.category?.name ?? 'Inconnu'} - ${service?.name ?? 'Inconnu'}
Description: ${description}
Fourchette du marché: ${avgMin} à ${avgMax} XOF (basé sur ${priceRange.length} professionnels)
Devis historiques: ${avgQuote > 0 ? `${Math.round(avgQuote)} XOF moyenne (${quotes.length} devis)` : 'Aucun historique'}
Localisation: ${latitude && longitude ? `${latitude}, ${longitude}` : 'Non spécifié'}

Retourne UNIQUEMENT un JSON valide:
{
  "min": prix_min_xof,
  "max": prix_max_xof,
  "median": prix_median_xof,
  "confidence": 0.0_a_1.0,
  "breakdown": { "main_doeuvre": montant, "materiaux": montant, "transport": montant }
}
Pas de texte avant ou après le JSON.`;

    try {
      const raw = await this.chatCompletion([{ role: 'user', content: prompt }], 400);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as PriceEstimate;
      const result: PriceEstimate = {
        min: Math.max(0, Math.round(parsed.min)),
        max: Math.round(parsed.max),
        median: Math.round(parsed.median),
        confidence: Math.min(1, Math.max(0, parsed.confidence)),
        breakdown: parsed.breakdown,
      };
      this.priceCache.set(cacheKey, { data: result, ts: Date.now() });
      return result;
    } catch (err) {
      this.logger.warn('AI price estimation failed, using DB averages', err);
      const fallback: PriceEstimate = {
        min: Math.round(avgMin || avgQuote * 0.7),
        max: Math.round(avgMax || avgQuote * 1.3),
        median: Math.round(avgQuote || (avgMin + avgMax) / 2 || 0),
        confidence: quotes.length > 5 ? 0.6 : 0.3,
        breakdown: null,
      };
      return fallback;
    }
  }

  // ─── Feature 4: Photo Diagnosis ───────────────────────────────────────

  async diagnosePhoto(imageBase64: string): Promise<DiagnosisResult> {
    if (!this.isOpenAiAvailable()) {
      return {
        issue: 'Service IA non configuré',
        category: 'Autre',
        serviceSuggested: 'Service général',
        urgency: 'NORMAL',
        confidence: 0,
      };
    }

    const prompt = `Analyse cette image et identifie le problème technique ou le besoin de service.

Catégories possibles: Plomberie, Électricité, Peinture, Menuiserie, Jardinage, Nettoyage, Serrurerie, Carrelage, Toiture, Climatisation, Autre.

Retourne UNIQUEMENT un JSON valide:
{
  "issue": "description du problème en français",
  "category": "catégorie parmi celles listées",
  "serviceSuggested": "service MONPRO recommandé",
  "urgency": "LOW|NORMAL|HIGH|URGENT",
  "confidence": 0.0_a_1.0
}
Pas de texte avant ou après le JSON.`;

    try {
      const res = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
        messages: [
          { role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ] },
        ],
        max_tokens: 400,
      });
      const raw = res.choices[0]?.message?.content ?? '';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as DiagnosisResult;
    } catch (err) {
      this.logger.warn('Photo diagnosis failed', err);
      return {
        issue: 'Impossible d\'analyser l\'image',
        category: 'Autre',
        serviceSuggested: 'Service général',
        urgency: 'NORMAL',
        confidence: 0,
      };
    }
  }

  // ─── Feature 5: Conversation Summary ──────────────────────────────────

  async summarizeConversation(conversationId: string): Promise<string> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { content: true, sender: { select: { fullName: true } }, createdAt: true },
    });

    if (messages.length === 0) return 'Aucun message dans cette conversation.';

    const prompt = `Résume cette conversation en 2-3 phrases claires.
Concentre-toi sur: le besoin exprimé, les accords pris, et les prochaines étapes.

Conversation:
${messages.map((m) => `${m.sender.fullName}: ${m.content}`).join('\n')}

Résumé concis:`;

    try {
      return await this.chatCompletion(
        [{ role: 'user', content: prompt }],
        200,
      );
    } catch (err) {
      this.logger.warn('Summary failed', err);
      return `${messages.length} messages échangés. Consultez la conversation pour les détails.`;
    }
  }

  // ─── Feature 6: Availability Prediction ───────────────────────────────

  async predictAvailability(
    professionalId: string,
    preferredDate?: Date,
  ): Promise<AvailabilityPrediction> {
    const bookings = await this.prisma.booking.findMany({
      where: { professionalId },
      select: {
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        createdAt: true,
      },
      orderBy: { scheduledDate: 'desc' },
      take: 60,
    });

    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const hourCounts = new Map<number, number>();

    for (const b of completedBookings) {
      const day = b.scheduledDate.getDay();
      dayCounts[day]++;
      if (b.scheduledTime) {
        const hour = parseInt(b.scheduledTime.split(':')[0], 10);
        if (!isNaN(hour)) {
          hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
        }
      }
    }

    const bookedDates = bookings
      .filter((b) => ['PENDING', 'CONFIRMED', 'ARRIVING', 'IN_PROGRESS'].includes(b.status))
      .map((b) => b.scheduledDate.toISOString().split('T')[0]);

    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const topDays = dayCounts
      .map((c, i) => ({ day: i, count: c }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topHours = [...hourCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => `${String(h).padStart(2, '0')}:00`);

    const prompt = `Prédit les créneaux de disponibilité pour ce professionnel.

Jours habituels de travail: ${topDays.map((d) => `${days[d.day]} (${d.count} interventions)`).join(', ')}
Horaires habituels: ${topHours.length > 0 ? topHours.join(', ') : 'Non déterminé'}
Dates déjà réservées: ${bookedDates.length > 0 ? bookedDates.join(', ') : 'Aucune'}
Date souhaitée par le client: ${preferredDate?.toISOString().split('T')[0] ?? 'Non spécifiée'}
Total interventions passées: ${completedBookings.length}

Retourne UNIQUEMENT un JSON valide:
{
  "slots": [{ "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "confidence": 0.0_a_1.0 }],
  "recommendation": "texte de recommandation en français"
}
Pas de texte avant ou après le JSON.`;

    try {
      const raw = await this.chatCompletion([{ role: 'user', content: prompt }], 600);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as AvailabilityPrediction;

      return {
        slots: (parsed.slots ?? []).filter((s) => !bookedDates.includes(s.date)),
        recommendation: parsed.recommendation ?? 'Consultez le professionnel pour les créneaux exacts.',
      };
    } catch (err) {
      this.logger.warn('Availability prediction failed', err);
      return {
        slots: [],
        recommendation: 'Impossible de prédire les disponibilités. Contactez directement le professionnel.',
      };
    }
  }
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface PriceEstimate {
  min: number;
  max: number;
  median: number;
  confidence: number;
  breakdown: { main_doeuvre: number; materiaux: number; transport: number } | null;
}

export interface DiagnosisResult {
  issue: string;
  category: string;
  serviceSuggested: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  confidence: number;
}

export interface AvailabilityPrediction {
  slots: Array<{ date: string; startTime: string; endTime: string; confidence: number }>;
  recommendation: string;
}
