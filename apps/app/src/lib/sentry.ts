import * as Sentry from "@sentry/react"

const dsn = import.meta.env.VITE_SENTRY_DSN as string
const release =
	(import.meta.env.VITE_SENTRY_RELEASE as string | undefined) ||
	(import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined)

if (dsn) {
	Sentry.init({
		dsn,
		sendDefaultPii: true,
		enabled: import.meta.env.PROD || !!import.meta.env.VITE_SENTRY_DSN,
		release,
	})
}
