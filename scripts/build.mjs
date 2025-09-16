import { build } from 'esbuild'
import stylePlugin from 'esbuild-style-plugin'
import { rimraf } from 'rimraf'
import path from 'path'
import fs from 'fs'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const isProduction = process.argv.includes('--production')

// Очистка директории сборки
const distDir = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distDir)) {
  rimraf.sync(distDir)
}

// Создание директории сборки
fs.mkdirSync(distDir, { recursive: true })

// Копирование статических файлов
const copyStaticFiles = () => {
  const publicDir = path.resolve(process.cwd(), 'public')
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true })
  }
  
  // Копирование index.html
  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Система печати термоэтикеток</title>
    <meta name="description" content="Система для создания и печати термоэтикеток для мебели ванной комнаты">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div id="app"></div>
    <script src="/js/main.js"></script>
</body>
</html>`
  
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent)
}

copyStaticFiles()

// Конфигурация сборки
const buildConfig = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  target: 'es2017',
  platform: 'browser',
  format: 'esm',
  splitting: true,
  outdir: path.join(distDir, 'js'),
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
  },
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer
        ]
      }
    })
  ],
  loader: {
    '.tsx': 'tsx',
    '.ts': 'tsx',
    '.js': 'jsx',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.gif': 'dataurl'
  },
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
}

// Сборка приложения
async function runBuild() {
  try {
    console.log('🚀 Building application...')
    await build(buildConfig)
    console.log('✅ Build completed successfully!')
    
    if (isProduction) {
      console.log('📦 Production build ready for deployment!')
    } else {
      console.log('🔧 Development build completed!')
    }
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

runBuild()
