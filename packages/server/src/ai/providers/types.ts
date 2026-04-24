export interface LLMProvider {
  name: string
  displayName: string
  availableModels: { id: string; label: string }[]
  generateSummary(opts: {
    prompt: string
    images: { data: string; mediaType: string }[]
    model: string
    apiKey: string
  }): Promise<string>
}
