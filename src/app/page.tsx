import StoriesApp from '@/components/StoriesApp'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/site'

// Server component wrapper: carries the WebSite structured data while
// StoriesApp (a client component) remains the entire interactive surface.
export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden" style={{ backgroundColor: '#0a0908' }}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          description:
            'Documented chains of custody for famous paintings — every fact sourced, every gap shown honestly.',
        }}
      />
      <StoriesApp />
    </main>
  )
}
