import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { BusinessType, Platform, User } from '../common/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException(
        'Bu elektron pochta manzili allaqachon roʻyxatdan oʻtgan',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Telegram bot uchun: chat ID bo'yicha foydalanuvchini topadi yoki
   * "shadow" (soddalashtirilgan) akkaunt yaratadi. Telegram foydalanuvchisi
   * saytda alohida ro'yxatdan o'tmasa ham platforma funksiyalaridan
   * (kredit/soliq hisob-kitobi, biznes-reja, chat) foydalana oladi.
   */
  async findOrCreateByTelegramChatId(
    telegramChatId: string,
    fullName: string,
    telegramUsername?: string,
  ): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { telegramChatId },
    });

    if (existing) {
      if (telegramUsername && existing.telegramUsername !== telegramUsername) {
        existing.telegramUsername = telegramUsername;
        await this.usersRepository.save(existing);
      }
      return existing;
    }

    const randomPassword = randomBytes(24).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = this.usersRepository.create({
      email: `tg_${telegramChatId}@telegram.local`,
      password: hashedPassword,
      fullName: fullName || `Telegram foydalanuvchi ${telegramChatId}`,
      businessType: BusinessType.YATT,
      telegramChatId,
      telegramUsername: telegramUsername || null,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Admin panelda "foydalanuvchi qaysi platformadan foydalanmoqda" degan
   * savolga javob berish uchun. `web` — sayt orqali kirish/ro'yxatdan
   * o'tish, `telegram` — bot orqali xabar yuborish. Ortiqcha DB yozuvlarini
   * kamaytirish uchun faqat oxirgi faollik 5 daqiqadan eski bo'lsa (yoki
   * umuman bo'lmasa) yangilanadi.
   */
  async markPlatformActivity(userId: string, platform: Platform): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const now = new Date();
    const shouldUpdate =
      !user.lastSeenAt || now.getTime() - user.lastSeenAt.getTime() > 5 * 60 * 1000;

    if (!shouldUpdate && user.lastPlatform === platform) {
      // Faollik yaqinda qayd etilgan va platforma o'zgarmagan — DB'ga
      // ortiqcha yozuv shart emas.
      return;
    }

    user.lastPlatform = platform;
    user.lastSeenAt = now;
    if (platform === 'web') {
      user.hasWebLogin = true;
    }

    await this.usersRepository.save(user);
  }
}