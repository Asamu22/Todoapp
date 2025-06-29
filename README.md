# Daily Activity Tracker

A modern, feature-rich todo list application designed to help you organize and track your daily activities with smart notifications and comprehensive progress analytics.

## Features

### 📝 Task Management
- **Create Tasks**: Add tasks with titles, descriptions, categories, and priority levels
- **Task Categories**: Organize tasks into categories (Work, Personal, Health, Learning, Shopping, Other)
- **Priority Levels**: Set task priorities (High, Medium, Low) with visual indicators
- **Due Time**: Set specific times for tasks with overdue notifications
- **Task Completion**: Mark tasks as complete with visual feedback

### 🔍 Advanced Filtering & Search
- **Real-time Search**: Search through task titles and descriptions instantly
- **Category Filtering**: Filter tasks by specific categories
- **Priority Filtering**: View tasks by priority level
- **Completion Status**: Toggle between showing/hiding completed tasks
- **Combined Filters**: Use multiple filters simultaneously for precise task management

### 📊 Progress Analytics
- **Visual Charts**: Interactive line and bar charts showing daily progress
- **7-Day Overview**: Track completion rates over the past week
- **Statistics Dashboard**: View total tasks, completed tasks, and today's progress
- **Completion Percentage**: Real-time calculation of daily completion rates

### 🔔 Smart Notifications
- **Upcoming Task Alerts**: Receive browser notifications 5 minutes before task due times
- **Overdue Indicators**: Visual alerts for tasks that have passed their due time
- **Permission Management**: Automatic notification permission requests

### 💾 Data Persistence
- **Local Storage**: All data is automatically saved to your browser's local storage
- **No Account Required**: Use the app without any registration or login
- **Data Recovery**: Your tasks persist between browser sessions

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Beautiful Gradients**: Modern color schemes with smooth transitions
- **Interactive Elements**: Hover effects and micro-interactions throughout
- **Clean Layout**: Intuitive interface with clear visual hierarchy

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daily-activity-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

### Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Usage

### Adding Tasks
1. Fill in the task title (required)
2. Optionally add a description
3. Select a category from the dropdown
4. Choose a priority level
5. Set a due time if needed
6. Click "Add Task"

### Managing Tasks
- **Complete**: Click the circle icon next to any task to mark it as complete
- **Delete**: Click the trash icon to remove a task
- **Filter**: Use the filter bar to find specific tasks
- **Search**: Type in the search box to find tasks by title or description

### Viewing Progress
- Check the analytics section for visual progress charts
- View completion statistics in the colored cards
- Track your productivity trends over the past week

### Notifications
- Allow browser notifications when prompted
- Receive alerts 5 minutes before task due times
- See visual indicators for overdue tasks

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts library
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Storage**: Browser Local Storage API

## Browser Compatibility

This application works in all modern browsers that support:
- ES2020 features
- Local Storage API
- Notification API (for alerts)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).