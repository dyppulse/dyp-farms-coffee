import { Injectable, NotFoundException } from '@nestjs/common';
import { ShopChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(channel?: ShopChannel) {
    return this.prisma.product.findMany({
      where: {
        active: true,
        ...(channel ? { channels: { has: channel } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        channels: dto.channels,
        roastLevel: dto.roastLevel,
        weightGrams: dto.weightGrams,
        unit: dto.unit ?? 'bag',
        priceUgx: dto.priceUgx,
        minOrderQty: dto.minOrderQty ?? 1,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.channels !== undefined ? { channels: dto.channels } : {}),
        ...(dto.roastLevel !== undefined ? { roastLevel: dto.roastLevel } : {}),
        ...(dto.weightGrams !== undefined
          ? { weightGrams: dto.weightGrams }
          : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.priceUgx !== undefined ? { priceUgx: dto.priceUgx } : {}),
        ...(dto.minOrderQty !== undefined
          ? { minOrderQty: dto.minOrderQty }
          : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  /** Admin-only listing, including inactive/retired products. */
  findAllForAdmin() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
