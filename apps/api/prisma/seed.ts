import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MONPRO database (idempotent)...');

  // ─── GEOGRAPHY ──────────────────────────────────────────────────────────
  const ci = await prisma.country.upsert({
    where: { code: 'CI' },
    update: {},
    create: { name: "Côte d'Ivoire", code: 'CI', dialCode: '+225', currency: 'XOF' },
  });

  let abidjanRegion = await prisma.region.findFirst({ where: { name: "District d'Abidjan", countryId: ci.id } });
  if (!abidjanRegion) {
    abidjanRegion = await prisma.region.create({ data: { name: "District d'Abidjan", countryId: ci.id } });
  }

  let abidjan = await prisma.city.findFirst({ where: { name: 'Abidjan', regionId: abidjanRegion.id } });
  if (!abidjan) {
    abidjan = await prisma.city.create({ data: { name: 'Abidjan', regionId: abidjanRegion.id } });
  }

  const districtNames = ['Cocody', 'Plateau', 'Marcory', 'Treichville', 'Yopougon', 'Abobo', 'Adjamé', 'Koumassi', 'Port-Bouët', 'Attécoubé'];
  const districts: any[] = [];
  for (const name of districtNames) {
    let district = await prisma.district.findFirst({ where: { name, cityId: abidjan.id } });
    if (!district) {
      district = await prisma.district.create({ data: { name, cityId: abidjan.id } });
    }
    districts.push(district);
  }

  const cocody = districts[0];
  const neighborhoods = ['Riviera', 'Angré', 'II Plateaux', 'Riviera Faya', 'Palmeraie', 'Bonoumin', 'Ambassade'];
  for (const name of neighborhoods) {
    const existing = await prisma.neighborhood.findFirst({ where: { name, districtId: cocody.id } });
    if (!existing) {
      await prisma.neighborhood.create({ data: { name, districtId: cocody.id } });
    }
  }

  // ─── CATEGORIES & SERVICES ──────────────────────────────────────────────
  const categoriesData = [
    {
      name: 'Maison & Habitat', slug: 'maison-habitat', sortOrder: 1,
      subcategories: [
        { name: 'Plomberie', slug: 'plomberie', services: ['Réparation fuite', 'Installation sanitaire', 'Débouchage', 'Remplacement robinet'] },
        { name: 'Électricité', slug: 'electricite', services: ['Installation électrique', 'Dépannage électrique', 'Mise aux normes', 'Tableau électrique'] },
        { name: 'Climatisation', slug: 'climatisation', services: ['Installation clim', 'Entretien clim', 'Réparation clim', 'Recharge gaz'] },
        { name: 'Peinture', slug: 'peinture', services: ['Peinture intérieure', 'Peinture extérieure', 'Ravalement façade'] },
        { name: 'Maçonnerie', slug: 'maconnerie', services: ['Mur', 'Clôture', 'Réparation fissure', 'Fondation'] },
        { name: 'Carrelage', slug: 'carrelage', services: ['Pose carrelage', 'Remplacement carreau', 'Faïence'] },
        { name: 'Menuiserie', slug: 'menuiserie', services: ['Porte', 'Fenêtre', 'Placard', 'Meuble sur mesure'] },
        { name: 'Serrurerie', slug: 'serrurerie', services: ['Ouverture porte', 'Changement serrure', 'Double clé'] },
      ],
    },
    {
      name: 'Électronique & Technologie', slug: 'electronique-technologie', sortOrder: 2,
      subcategories: [
        { name: 'Réparation téléphone', slug: 'reparation-telephone', services: ['Écran cassé', 'Batterie', 'Connecteur charge', 'Logiciel'] },
        { name: 'Réparation ordinateur', slug: 'reparation-ordinateur', services: ['Formatage', 'Réparation hardware', 'Récupération données', 'Virus'] },
        { name: 'Installation réseau', slug: 'installation-reseau', services: ['Wi-Fi', 'Câblage réseau', 'Configuration routeur'] },
        { name: 'Caméras de surveillance', slug: 'cameras-surveillance', services: ['Installation caméra', 'Configuration DVR', 'Maintenance'] },
      ],
    },
    {
      name: 'Automobile', slug: 'automobile', sortOrder: 3,
      subcategories: [
        { name: 'Mécanique', slug: 'mecanique', services: ['Vidange', 'Freins', 'Embrayage', 'Courroie distribution'] },
        { name: 'Électricité automobile', slug: 'electricite-automobile', services: ['Batterie', 'Démarreur', 'Alternateur', 'Éclairage'] },
        { name: 'Climatisation automobile', slug: 'climatisation-automobile', services: ['Recharge clim auto', 'Réparation compresseur'] },
        { name: 'Dépannage automobile', slug: 'depannage-automobile', services: ['Remorquage', 'Panne route', 'Crevaison'] },
      ],
    },
    {
      name: 'Entretien', slug: 'entretien', sortOrder: 4,
      subcategories: [
        { name: 'Nettoyage maison', slug: 'nettoyage-maison', services: ['Ménage régulier', 'Grand ménage', 'Nettoyage vitres'] },
        { name: 'Nettoyage bureau', slug: 'nettoyage-bureau', services: ['Entretien quotidien', 'Nettoyage sol', 'Désinfection bureau'] },
        { name: 'Jardinage', slug: 'jardinage', services: ['Tonte pelouse', 'Taille haie', 'Entretien jardin', 'Arrosage'] },
        { name: 'Désinfection', slug: 'desinfection', services: ['Dératisation', 'Désinsectisation', 'Traitement termites'] },
      ],
    },
    {
      name: 'BTP', slug: 'btp', sortOrder: 5,
      subcategories: [
        { name: 'Construction', slug: 'construction', services: ['Gros œuvre', 'Second œuvre', 'Extension'] },
        { name: 'Rénovation', slug: 'renovation', services: ['Rénovation complète', 'Rénovation cuisine', 'Rénovation salle de bain'] },
        { name: 'Architecture', slug: 'architecture', services: ['Plan maison', 'Permis construire', 'Suivi chantier'] },
      ],
    },
    {
      name: 'Transport & Logistique', slug: 'transport-logistique', sortOrder: 6,
      subcategories: [
        { name: 'Déménagement', slug: 'demenagement', services: ['Déménagement local', 'Déménagement longue distance', 'Emballage'] },
        { name: 'Transport', slug: 'transport', services: ['Transport marchandises', 'Livraison', 'Manutention'] },
      ],
    },
    {
      name: 'Événementiel', slug: 'evenementiel', sortOrder: 7,
      subcategories: [
        { name: 'Photographie', slug: 'photographie', services: ['Photo mariage', 'Photo événement', 'Photo portrait'] },
        { name: 'Décoration', slug: 'decoration', services: ['Décoration mariage', 'Décoration événement', 'Décoration intérieure'] },
        { name: 'Traiteur', slug: 'traiteur', services: ['Buffet', 'Cocktail', 'Repas événement'] },
      ],
    },
    {
      name: 'Beauté & Bien-être', slug: 'beaute-bien-etre', sortOrder: 8,
      subcategories: [
        { name: 'Coiffure', slug: 'coiffure', services: ['Coiffure femme', 'Coiffure homme', 'Tresses', 'Tissage'] },
        { name: 'Esthétique', slug: 'esthetique', services: ['Maquillage', 'Soin visage', 'Onglerie', 'Épilation'] },
        { name: 'Massage', slug: 'massage', services: ['Massage relaxant', 'Massage sportif', 'Massage à domicile'] },
      ],
    },
    {
      name: 'Éducation', slug: 'education', sortOrder: 9,
      subcategories: [
        { name: 'Cours particuliers', slug: 'cours-particuliers', services: ['Maths', 'Français', 'Anglais', 'Sciences'] },
        { name: 'Formation', slug: 'formation', services: ['Informatique', 'Langues', 'Bureautique'] },
        { name: 'Coaching', slug: 'coaching', services: ['Coaching scolaire', 'Coaching professionnel'] },
      ],
    },
    {
      name: 'Services professionnels', slug: 'services-professionnels', sortOrder: 10,
      subcategories: [
        { name: 'Comptabilité', slug: 'comptabilite', services: ['Bilan', 'Déclaration fiscale', 'Tenue comptable'] },
        { name: 'Graphisme', slug: 'graphisme', services: ['Logo', 'Flyer', 'Carte visite', 'Branding'] },
        { name: 'Développement web', slug: 'developpement-web', services: ['Site vitrine', 'E-commerce', 'Application web'] },
        { name: 'Marketing digital', slug: 'marketing-digital', services: ['Community management', 'Publicité', 'SEO'] },
      ],
    },
  ];

  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: { name: catData.name, sortOrder: catData.sortOrder },
      create: { name: catData.name, slug: catData.slug, sortOrder: catData.sortOrder },
    });

    for (const subData of catData.subcategories) {
      const subcategory = await prisma.subcategory.upsert({
        where: { slug: subData.slug },
        update: { name: subData.name, categoryId: category.id },
        create: { name: subData.name, slug: subData.slug, categoryId: category.id },
      });

      for (const serviceName of subData.services) {
        const serviceSlug = `${subData.slug}-${serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
        await prisma.service.upsert({
          where: { slug: serviceSlug },
          update: { name: serviceName, subcategoryId: subcategory.id },
          create: { name: serviceName, slug: serviceSlug, subcategoryId: subcategory.id },
        });
      }
    }
  }

  // ─── DEMO USERS ─────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { phone: '+2250100000000' },
    update: {},
    create: {
      phone: '+2250100000000',
      fullName: '[DEMO] Admin MONPRO',
      role: UserRole.ADMIN,
      countryId: ci.id,
      cityId: abidjan.id,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { phone: '+2250700000001' },
    update: {},
    create: {
      phone: '+2250700000001',
      fullName: '[DEMO] Konan Aya',
      role: UserRole.CLIENT,
      countryId: ci.id,
      cityId: abidjan.id,
    },
  });

  const proUser = await prisma.user.upsert({
    where: { phone: '+2250700000002' },
    update: {},
    create: {
      phone: '+2250700000002',
      fullName: '[DEMO] Diallo Ibrahim',
      role: UserRole.PROFESSIONAL,
      countryId: ci.id,
      cityId: abidjan.id,
    },
  });

  const plomberieServices = await prisma.service.findMany({
    where: { subcategory: { slug: 'plomberie' } },
  });

  let professional = await prisma.professional.findUnique({ where: { userId: proUser.id } });
  if (!professional) {
    professional = await prisma.professional.create({
      data: {
        userId: proUser.id,
        businessName: '[DEMO] Diallo Plomberie',
        description: 'Plombier professionnel avec 8 ans d\'expérience à Abidjan.',
        experienceYears: 8,
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        averageRating: 4.7,
        totalReviews: 23,
        totalInterventions: 45,
        responseRate: 0.92,
        completionRate: 0.95,
        isAvailable: true,
      },
    });

    for (const service of plomberieServices) {
      await prisma.professionalService.upsert({
        where: { professionalId_serviceId: { professionalId: professional.id, serviceId: service.id } },
        update: {},
        create: { professionalId: professional.id, serviceId: service.id, priceMin: 5000, priceMax: 50000 },
      });
    }

    await prisma.professionalZone.create({
      data: { professionalId: professional.id, name: 'Cocody et environs', latitude: 5.3599, longitude: -3.9942, radiusKm: 10 },
    });

    for (let day = 1; day <= 6; day++) {
      await prisma.professionalAvailability.create({
        data: { professionalId: professional.id, dayOfWeek: day, startTime: '08:00', endTime: '18:00' },
      });
    }
  }

  // ─── COMMISSION CONFIG (global default) ─────────────────────────────────
  const existingConfig = await prisma.commissionConfig.findFirst({ where: { isDefault: true } });
  if (!existingConfig) {
    await prisma.commissionConfig.create({
      data: { rate: 0.10, isDefault: true },
    });
  }

  // ─── EMAIL TEST ACCOUNTS ────────────────────────────────────────────────
  const testPassword = await bcrypt.hash('TestPass123!', 10);

  const emailClient = await prisma.user.upsert({
    where: { email: 'client@test.monpro.com' },
    update: {},
    create: {
      email: 'client@test.monpro.com',
      passwordHash: testPassword,
      fullName: '[TEST] Client Email',
      role: UserRole.CLIENT,
      countryId: ci.id,
      cityId: abidjan.id,
    },
  });

  const emailPro = await prisma.user.upsert({
    where: { email: 'pro@test.monpro.com' },
    update: {},
    create: {
      email: 'pro@test.monpro.com',
      passwordHash: testPassword,
      fullName: '[TEST] Pro Email',
      role: UserRole.PROFESSIONAL,
      countryId: ci.id,
      cityId: abidjan.id,
    },
  });

  console.log('Seed completed successfully (idempotent)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
