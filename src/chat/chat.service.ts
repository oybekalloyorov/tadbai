import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, MessageRole } from './entities/chat-message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { AiService, ChatTurn } from '../common/ai/ai.service';
import { User } from '../common/entities/user.entity';

const SYSTEM_PROMPT = `
Sen O'zbekistondagi kichik va o'rta biznes (KOB) subyektlari uchun AI moliyaviy
maslahatchisan. Vazifang — tadbirkorlarga moliyaviy savodxonlik, biznes-reja tuzish,
kredit olish jarayonlari va soliqlar boʻyicha aniq, tushunarli va amaliy maslahatlar berish.

Qoidalar:
- Faqat oʻzbek tilida javob ber.
- Javoblaring qisqa, aniq va amaliy boʻlsin, ortiqcha "suv" boʻlmasin.
- Agar savol kredit hisob-kitobi yoki soliq hisob-kitobi bilan bogʻliq boʻlsa,
  foydalanuvchini platformadagi "kredit kalkulyatori" yoki "soliq kalkulyatori"
  boʻlimidan foydalanishga yoʻnaltir.
- Sen moliyaviy maslahatchisan, lekin litsenziyalangan buxgalter yoki huquqshunos
  emassan — murakkab yuridik/soliq masalalarida mutaxassisga murojaat qilishni tavsiya et.
- Hech qachon aniq bank yoki tashkilot nomlarini kafolat sifatida tavsiya qilma.
`;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly aiService: AiService,
  ) {}

  async sendMessage(user: User, dto: SendMessageDto) {
    const conversationId = dto.conversationId || uuidv4();

    const history = await this.chatMessageRepository.find({
      where: { conversationId, user: { id: user.id } },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    const userMessage = this.chatMessageRepository.create({
      user,
      conversationId,
      role: MessageRole.USER,
      content: dto.message,
    });
    await this.chatMessageRepository.save(userMessage);

    const chatTurns: ChatTurn[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: dto.message },
    ];

    const aiResponse = await this.aiService.chat(chatTurns);

    const assistantMessage = this.chatMessageRepository.create({
      user,
      conversationId,
      role: MessageRole.ASSISTANT,
      content: aiResponse,
    });
    await this.chatMessageRepository.save(assistantMessage);

    return {
      conversationId,
      reply: aiResponse,
      createdAt: assistantMessage.createdAt,
    };
  }

  async getConversation(userId: string, conversationId: string) {
    return this.chatMessageRepository.find({
      where: { conversationId, user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async getConversations(userId: string) {
    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .select('message.conversationId', 'conversationId')
      .addSelect('MAX(message.createdAt)', 'lastMessageAt')
      .where('message.userId = :userId', { userId })
      .groupBy('message.conversationId')
      .orderBy('"lastMessageAt"', 'DESC')
      .getRawMany();

    return messages;
  }
}
