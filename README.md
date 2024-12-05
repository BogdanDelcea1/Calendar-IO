Booking Management Application

Table of Contents

	1.	Introduction
	2.	Features
	3.	Technologies Used
	4.	Architecture
	5.	Key Highlights
	6.	Setup Instructions
	7.	Application Walkthrough
	8.	Code Overview
	9.	Future Enhancements
	10.	Acknowledgments

Introduction

This application is a full-stack booking management system designed to handle event creation, user participation, and Google Calendar integration. It is optimized for real-time responsiveness, efficient data handling, and intuitive user interaction. Built with a focus on algorithmic precision and user-centered design, the application streamlines the process of creating, editing, confirming, and managing bookings.

Features

	•	User Authentication and Authorization: Secure login/logout with role-based access control.
	•	Event Creation and Management: Create, edit, or delete events with ease.
	•	Participant Management: Invite participants, confirm or decline participation.
	•	Real-Time Updates: Reflects booking status dynamically based on user actions.
	•	Google Calendar Integration: Synchronize events with Google Calendar.
	•	Dark Mode Toggle: Provides a visually comfortable experience for users.
	•	Responsive Design: Fully functional across devices and screen sizes.
	•	Easter Egg: A hidden feature for fun interaction!

Technologies Used

	•	Frontend: SvelteKit for reactive and efficient UI.
	•	Backend: Node.js with Prisma for seamless database interaction.
	•	Database: Free SQL Database (MySQL) for robust data storage.
	•	Google Calendar API: For event synchronization.
	•	CSS: Custom modern styling for a polished look.
	•	Environment Variables: Secure storage of sensitive credentials like API keys and database URLs.

Architecture

1. Frontend

	•	Built with SvelteKit for dynamic, component-based UI.
	•	Implements conditional rendering for role-specific actions.
	•	Utilizes responsive and modern styling.

2. Backend

	•	Node.js server handles API endpoints for CRUD operations.
	•	Prisma ORM ensures type-safe database interactions.
	•	Server-side logic for role-based authorization and secure data handling.

3. Database

	•	MySQL database schema designed with normalization principles.
	•	Relationships between users, events, and bookings are maintained for data integrity.

Key Highlights

UI/UX

	•	Clean, modern design with intuitive navigation.
	•	Supports both light and dark modes.
	•	Dynamic rendering ensures users only see relevant actions based on their roles.

Algorithmic Logic

	•	Efficiently fetches and updates booking data in real time.
	•	Role-based conditional rendering prevents unauthorized actions.
	•	Server-side validation ensures data security and integrity.

Google Calendar Integration

	•	Synchronizes events with Google Calendar for improved accessibility.
	•	Automatically handles token refresh and event invitations.

Developer Tools

	•	Modular codebase for easy maintenance and scalability.
	•	Extensive comments and structured documentation for all components.

Setup Instructions

Prerequisites

	1.	Node.js: Ensure Node.js is installed.
	2.	MySQL Database: Set up a MySQL database or use the provided free SQL database credentials.
	3.	Google Calendar API: Obtain credentials from the Google Developer Console.

Steps

	1.	Clone the Repository:

git clone <repository-url>
cd <repository-folder>


	2.	Install Dependencies:

npm install


	3.	Set Up Environment Variables:
Create a .env file in the root directory with the following:

DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>"
JWT_SECRET="<your-secret-key>"
GOOGLE_CLIENT_ID="<google-client-id>"
GOOGLE_CLIENT_SECRET="<google-client-secret>"


	4.	Migrate Database:

npx prisma migrate dev --name init


	5.	Start the Server:

npm run dev


	6.	Access the Application:
Open your browser and navigate to http://localhost:3000.

Application Walkthrough

Homepage

The homepage serves as the gateway, showcasing available features and providing quick access to important sections.

User Authentication

	•	Secure login/logout functionality.
	•	Role-based dashboard access.

Event Creation

	•	Navigate to the New Booking page to create an event.
	•	Input title, description, platform, duration, start, and end times.

Pending Bookings

	•	Displays bookings requiring user action (confirm or decline).
	•	Dynamic updates reflect real-time status changes.

Editing Bookings

	•	Organizers can edit bookings to adjust event details.
	•	Changes sync dynamically with the database and Google Calendar.

Dark Mode

	•	Toggle between light and dark modes for an optimal visual experience.

Code Overview

UI Components

	•	Navbar: Handles navigation, logout, and dark mode toggle.

function toggleNightMode() {
  darkMode.update((value) => {
    const newValue = !value;
    localStorage.setItem('darkMode', newValue);
    document.documentElement.classList.toggle('dark-mode', newValue);
    return newValue;
  });
}



API Endpoints

	•	Booking Creation: Handles event creation and participant assignment.

const newEvent = await prisma.event.create({
  data: { title, description, duration, platform, startTime, endTime, creatorId },
});



Server-Side Logic

	•	Role-Based Authorization: Ensures only organizers or participants can access booking details.

const isAuthorized =
  booking.organizerId === user.id || booking.participants.some(p => p.userId === user.id);
if (!isAuthorized) throw error(403, 'Unauthorized access.');

Future Enhancements

	•	Email Notifications: Automatically notify participants of event updates.
	•	Multi-Language Support: Localize the UI for global users.
	•	Analytics Dashboard: Provide insights into user activity and event trends.

Acknowledgments

This project would not have been possible without:
	•	Prisma ORM for its robust database interactions.
	•	Google Calendar API for seamless calendar integration.
	•	SvelteKit for its efficient and dynamic framework.
	•	Free SQL Database for hosting data during development.