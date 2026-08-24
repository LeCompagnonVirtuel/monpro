import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeographyService {
  constructor(private prisma: PrismaService) {}

  async getCountries() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getRegions(countryId: string) {
    return this.prisma.region.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
    });
  }

  async getCities(regionId: string) {
    return this.prisma.city.findMany({
      where: { regionId },
      orderBy: { name: 'asc' },
    });
  }

  async getDistricts(cityId: string) {
    return this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }

  async getNeighborhoods(districtId: string) {
    return this.prisma.neighborhood.findMany({
      where: { districtId },
      orderBy: { name: 'asc' },
    });
  }

  async createCountry(data: { name: string; code: string; dialCode: string; currency: string }) {
    return this.prisma.country.create({ data });
  }

  async createRegion(data: { name: string; countryId: string }) {
    return this.prisma.region.create({ data });
  }

  async createCity(data: { name: string; regionId: string }) {
    return this.prisma.city.create({ data });
  }

  async createDistrict(data: { name: string; cityId: string }) {
    return this.prisma.district.create({ data });
  }

  async createNeighborhood(data: { name: string; districtId: string }) {
    return this.prisma.neighborhood.create({ data });
  }
}
