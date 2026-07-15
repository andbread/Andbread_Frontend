import type { JsonLdObject } from '@/lib/jsonLd'

interface JsonLdScriptProps {
  data: JsonLdObject
}

const JsonLdScript = ({ data }: JsonLdScriptProps) => {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

export default JsonLdScript
