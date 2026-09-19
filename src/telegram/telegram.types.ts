import { Scenes } from 'telegraf';

export type BotContext = Scenes.WizardContext;

export interface BotSessionData {
  userId?: string;
  conversationId?: string;
}