import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();
const botToken = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

let isEmailRequested = false;
let firstMessageId: number | undefined;

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const currentHour = new Date().getHours();

  if (!isEmailRequested) {
    if (currentHour >= 9 && currentHour <= 18) {
      bot.sendMessage(chatId, 'Esse e o link: https://faesa.br');
    } else {
      bot.sendMessage(
        chatId,
        'Você encaminhou mensagem muito tarde,funcionamos nesse horario (09:00 às 18:00).Digite seu e-mail para entrarmos em contato.'
      );
      isEmailRequested = true;
      firstMessageId = msg.message_id;
    }
  }
});

bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  const currentHour = new Date().getHours();
  const email = msg.text;

  if (isEmailRequested && msg.message_id !== firstMessageId && (currentHour < 9 || currentHour > 18)) {
    const emailPattern = /\S+@\S+\.\S+/;
    if (typeof email === 'string' && emailPattern.test(email)) {
      try {
        await prisma.email.create({ data: { email } });
        bot.sendMessage(chatId, 'E-mail registrado para contato futuro.');
        isEmailRequested = false;
        firstMessageId = undefined;
      } catch (error) {
        console.error('Erro ao armazenar o e-mail:', error);
        bot.sendMessage(
          chatId,
          'Erro ao processar sua solicitação, tente novamente mais tarde.'
        );
      }
    } else {
      bot.sendMessage(chatId, 'Forneça um endereço de e-mail válido.');
    }
  }
});
