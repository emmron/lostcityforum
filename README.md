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
- Astro DB for database management

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

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

3. Run the development server
```sh
npm run dev
```

4. Open your browser and navigate to `http://localhost:4321`

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run db:push`         | Push database schema to remote (Turso)           |
| `npm run db:seed`         | Seed the remote database with initial data       |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 📝 Deployment to Vercel

This project uses Astro DB with Turso (LibSQL) for the database. Follow these steps to deploy:

### 1. Create a Turso Database

1. Sign up at [turso.tech](https://turso.tech) (free tier available)
2. Install the Turso CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
3. Login: `turso auth login`
4. Create a database: `turso db create lostcityforum`
5. Get your database URL: `turso db show lostcityforum --url`
6. Create an auth token: `turso db tokens create lostcityforum`

### 2. Push Database Schema

```sh
# Set environment variables locally
export ASTRO_DB_REMOTE_URL="libsql://your-database.turso.io"
export ASTRO_DB_APP_TOKEN="your-turso-token"

# Push schema to remote database
npm run db:push
```

### 3. Deploy to Vercel

1. Connect your repository to Vercel
2. Add the following environment variables in Vercel dashboard:
   - `ASTRO_DB_REMOTE_URL` - Your Turso database URL
   - `ASTRO_DB_APP_TOKEN` - Your Turso auth token
3. Deploy!

### 4. Seed the Database (Optional)

```sh
npm run db:seed
```

This will create the initial admin user and sample forum categories.

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

1. Set up authentication
2. Implement user roles and permissions
3. Connect the frontend components to your Astro DB models

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Built with [Astro](https://astro.build/)
- Inspired by 2004-era RuneScape and the Lost City quest
