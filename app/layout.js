import '../src/index.css'

export const metadata = {
  title: 'WebForge.ai - Build SaaS at the Speed of Thought',
  description: 'AI-powered website builder that turns prompts into production-ready code',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
