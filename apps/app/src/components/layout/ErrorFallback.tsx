import { Button } from "@/components/ui/button"

export function ErrorFallback() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-muted px-6">
			<div className="w-full max-w-sm text-center space-y-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold">Something went wrong</h1>
					<p className="text-muted-foreground">
						An unexpected error occurred. Please reload the page and try again.
					</p>
				</div>

				<Button className="w-full" onClick={() => window.location.reload()}>
					Reload page
				</Button>
			</div>
		</div>
	)
}
