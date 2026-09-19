import { AppDataSource } from '../config/typeorm.config';
import { User, BusinessType } from '../common/entities/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Boshlang'ich (demo) maʼlumotlarni bazaga yozish uchun skript.
 * Ishga tushirish: npm run seed
 */
async function seed() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@kobfin.uz' },
  });

  if (!existingAdmin) {
    const admin = userRepository.create({
      email: 'admin@kobfin.uz',
      password: await bcrypt.hash('Admin123!', 10),
      fullName: 'Administrator',
      role: 'admin',
      businessType: BusinessType.BOSHQA,
      isActive: true,
    });
    await userRepository.save(admin);
    // eslint-disable-next-line no-console
    console.log('✅ Admin foydalanuvchi yaratildi: admin@kobfin.uz / Admin123!');
  } else {
    // eslint-disable-next-line no-console
    console.log('ℹ️ Admin foydalanuvchi allaqachon mavjud, oʻtkazib yuborildi.');
  }

  await AppDataSource.destroy();
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed jarayonida xatolik:', error);
  process.exit(1);
});
