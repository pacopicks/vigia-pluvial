import { useState } from "react"
import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Tarjetas de opiniones con avatar de iniciales
// y un enlace a la fuente de cada una.
export interface Testimonial {
  image?: string
  initials: string
  name: string
  username: string
  text: string
  social: string
  tag?: string
}

interface TestimonialsProps {
  testimonials: Testimonial[]
  className?: string
  title?: string
  description?: string
  maxDisplayed?: number
}

export function Testimonials({
  testimonials,
  className,
  title = "Read what people are saying",
  description = "",
  maxDisplayed = 6,
}: TestimonialsProps) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center pt-5">
        <div className="mb-8 flex flex-col gap-5">
          <h2 className="text-center font-display text-3xl font-semibold md:text-4xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-center text-muted-foreground">
            {description.split("<br />").map((line, i) => (
              <span key={i}>
                {line}
                {i !== description.split("<br />").length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            "flex flex-wrap items-stretch justify-center gap-5",
            !showAll && testimonials.length > maxDisplayed && "max-h-[720px] overflow-hidden",
          )}
        >
          {testimonials.slice(0, showAll ? undefined : maxDisplayed).map((testimonial, index) => (
            <Card key={index} className="relative flex h-auto w-80 max-w-full flex-col border-border bg-card p-5">
              <div className="flex items-center pr-6">
                <Avatar className="size-12">
                  {testimonial.image && <AvatarImage src={testimonial.image} alt={testimonial.name} />}
                  <AvatarFallback className="bg-agua/15 text-sm font-semibold text-agua">{testimonial.initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col pl-4">
                  <span className="text-base font-semibold">{testimonial.name}</span>
                  <span className="text-sm text-muted-foreground">{testimonial.username}</span>
                </div>
              </div>
              <div className="my-5 flex-1">
                <p className="font-medium text-foreground">{testimonial.text}</p>
              </div>
              {testimonial.tag && <span className="text-xs text-muted-foreground">{testimonial.tag}</span>}
              <a
                href={testimonial.social}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir la fuente: ${testimonial.name}`}
                className="absolute right-4 top-4 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-80"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Card>
          ))}
        </div>

        {testimonials.length > maxDisplayed && !showAll && (
          <>
            <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 transform">
              <Button variant="secondary" onClick={() => setShowAll(true)}>
                Ver más
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
