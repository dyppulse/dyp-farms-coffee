import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../common/data/store.service';
import { BoundaryPointDto, CreateFarmDto, UpdateFarmDto } from './dto/farms.dto';

// Prisma's Json column wants plain objects, not class instances — plain-copy the
// class-validator DTO array before handing it to the client.
function toJsonBoundary(points: BoundaryPointDto[]): Prisma.InputJsonValue {
  return points.map((p) => ({ lat: p.lat, lng: p.lng }));
}

@Injectable()
export class FarmsService {
  constructor(
    private prisma: PrismaService,
    private store: StoreService,
  ) {}

  create(ownerId: string, dto: CreateFarmDto) {
    return this.prisma.farm.create({
      data: {
        ownerId,
        name: dto.name,
        sizeHectares: dto.sizeHectares,
        boundary: toJsonBoundary(dto.boundary),
      },
    });
  }

  findMine(ownerId: string) {
    return this.prisma.farm.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOwned(id: string, ownerId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id } });
    if (!farm) throw new NotFoundException('Farm not found');
    if (farm.ownerId !== ownerId) {
      throw new ForbiddenException("Not your farm");
    }
    return farm;
  }

  async update(id: string, ownerId: string, dto: UpdateFarmDto) {
    await this.findOneOwned(id, ownerId);
    return this.prisma.farm.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.sizeHectares !== undefined
          ? { sizeHectares: dto.sizeHectares }
          : {}),
        ...(dto.boundary !== undefined
          ? { boundary: toJsonBoundary(dto.boundary) }
          : {}),
      },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.findOneOwned(id, ownerId);
    await this.prisma.farm.delete({ where: { id } });
    return { success: true };
  }

  /** Admin-only: every farm on the platform, with the owner's name/email joined in
   * from the in-memory user store (Farm.ownerId isn't a real FK — see schema.prisma). */
  async findAllForAdmin() {
    const farms = await this.prisma.farm.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return farms.map((farm) => {
      const owner = this.store.findUserById(farm.ownerId);
      return {
        ...farm,
        owner: owner
          ? { id: owner.id, name: owner.name, email: owner.email }
          : null,
      };
    });
  }
}
