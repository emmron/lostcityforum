# 2004scape Lost City Forum

A nostalgic forum for the 2004-era RuneScape community, focused on the Lost City quest and experience. Built with Astro.js to provide a fast, modern implementation with a classic forum appearance.

![2004scape Lost City Forum](https://github.com/yourusername/lostcityforum/raw/main/screenshot.png)

## 🏰 Features

- Classic 2004-style forum appearance
- Forum categories and topics
- User profiles and membership system
- Topic and post creation
- Search functionality
- Mobile-responsive design
- PostgreSQL database for production (SQLite for development)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL (for production) - SQLite is used for development by default

### Installation

1. Clone this repository
```sh
git clone https://github.com/yourusername/lostcityforum.git
cd lostcityforum
```

2. Install dependencies
```sh
npm install
```

3. Set up the database
```sh
# For development with SQLite (default)
npm run prisma:migrate
npm run prisma:seed

# For PostgreSQL (recommended for production)
# Update .env with your PostgreSQL connection string
# Then run:
node prisma-deploy.js
```

4. Run the development server
```sh
npm run dev
```

5. Open your browser and navigate to `http://localhost:4321`

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run prisma:migrate`  | Run database migrations                          |
| `npm run prisma:seed`     | Seed the database with initial data              |
| `npm run prisma:studio`   | Open Prisma Studio to manage database            |
| `npm run prisma:reset`    | Reset the database (caution: deletes all data)   |

## 📝 Deployment

For deployment to Vercel with PostgreSQL, see the [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) guide.

## 📁 Project Structure

```text
/
├── public/               # Static assets
│   ├── images/           # Forum images
│   │   ├── avatars/      # User avatars
│   │   └── background.jpg # Background image
│   ├── styles/           # Global CSS
│   └── favicon.svg
├── src/
│   ├── components/       # Reusable components
│   ├── layouts/          # Page layouts
│   │   └── MainLayout.astro # Main forum layout
│   └── pages/            # Route pages
│       ├── forums/       # Forum pages
│       ├── topics/       # Topic pages
│       ├── members/      # Member pages
│       ├── search.astro  # Search page
│       └── index.astro   # Homepage
└── package.json
```

## 🎨 Customization

### Styling

The forum's appearance is controlled by CSS variables in `public/styles/global.css`. You can modify these to change the color scheme and general appearance.

### Adding Real Functionality

This is currently a static forum with mock data. To convert it to a fully functional forum, you would need to:

1. Set up a database (like PostgreSQL, MongoDB, etc.)
2. Add backend functionality (consider using Astro's API endpoints or a separate API service)
3. Implement user authentication
4. Connect the frontend components to your backend APIs

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Built with [Astro](https://astro.build/)
- Inspired by 2004-era RuneScape and the Lost City quest
