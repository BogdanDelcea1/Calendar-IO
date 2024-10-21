// src/lib/notificationDispatcher.js

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// In-memory notification queue
const notificationQueue = [];

// Function to enqueue notifications
export function enqueueNotification(notificationData) {
  notificationQueue.push(notificationData);
}

// Function to dispatch notifications
async function dispatchNotifications() {
  while (notificationQueue.length > 0) {
    const notificationData = notificationQueue.shift();
    try {
      await processNotification(notificationData);
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }

  // Schedule the next dispatch
  setTimeout(dispatchNotifications, 1000);
}

// Function to process a single notification
async function processNotification(notificationData) {
    const { userId, message, type } = notificationData;
  
    // Retrieve user settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true }
    });
  
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }
  
    const receiveEmails = user.settings?.receiveEmails ?? true;
  
    if (type === 'EMAIL' && receiveEmails) {
      await sendEmail(user.email, message);
    }
  
    // Save notification to database
    await prisma.notification.create({
      data: {
        userId,
        message,
        type,
        sent: true
      }
    });
  }  

// Function to send an email
async function sendEmail(to, message) {
  // Configure your SMTP transporter
  const transporter = nodemailer.createTransport({
    // Example using Gmail SMTP
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com', // Replace with your email
      pass: 'your-email-password'   // Replace with your email password or app-specific password
    }
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject: 'Notification',
    text: message
  };

  await transporter.sendMail(mailOptions);
}

// Start the dispatcher
dispatchNotifications();
