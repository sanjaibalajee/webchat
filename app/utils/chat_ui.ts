import {
    MLCEngineInterface,
    ChatCompletionMessageParam,
    CompletionUsage,
  } from "@mlc-ai/web-llm"
  
  export type MessageUpdateFunction = (
    kind: string,
    text: string,
    append: boolean
  ) => void
  
  export type RuntimeStatsUpdateFunction = (runtimeStats: string) => void
  
  export class ChatUI {
    private engine: MLCEngineInterface
    private chatLoaded: boolean = false
    private requestInProgress: boolean = false
    private chatRequestChain: Promise<void> = Promise.resolve()
    private chatHistory: ChatCompletionMessageParam[] = []
  
    constructor(engine: MLCEngineInterface) {
      this.engine = engine
    }
  
    private pushTask(task: () => Promise<void>): void {
      const lastEvent = this.chatRequestChain
      this.chatRequestChain = lastEvent.then(task)
    }
  
    async onGenerate(
      prompt: string,
      messageUpdate: MessageUpdateFunction,
      setRuntimeStats: RuntimeStatsUpdateFunction
    ): Promise<void> {
      if (this.requestInProgress) {
        return
      }
      
      this.pushTask(async () => {
        await this.asyncGenerate(prompt, messageUpdate, setRuntimeStats)
      })
      
      return this.chatRequestChain
    }
  
    async onReset(clearMessages: () => void): Promise<void> {
      if (this.requestInProgress) {
        this.engine.interruptGenerate()
      }
      
      this.chatHistory = []
      
      this.pushTask(async () => {
        await this.engine.resetChat()
        clearMessages()
      })
      
      return this.chatRequestChain
    }
  
    async asyncInitChat(messageUpdate: MessageUpdateFunction): Promise<void> {
      if (this.chatLoaded) return
  
      this.requestInProgress = true
      messageUpdate("init", "", true)
  
      const initProgressCallback = (report: { text: string }) => {
        messageUpdate("init", report.text, false)
      }
      this.engine.setInitProgressCallback(initProgressCallback)
  
      try {
        const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"
        await this.engine.reload(selectedModel)
        
        this.chatLoaded = true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        messageUpdate("error", `Init error: ${errorMessage}`, true)
        console.error("Chat initialization error:", err)
        await this.unloadChat()
      } finally {
        this.requestInProgress = false
      }
    }
  
    private async unloadChat(): Promise<void> {
      await this.engine.unload()
      this.chatLoaded = false
    }
  
    private async asyncGenerate(
      prompt: string,
      messageUpdate: MessageUpdateFunction,
      setRuntimeStats: RuntimeStatsUpdateFunction
    ): Promise<void> {
      if (!prompt.trim()) {
        return
      }
  
      await this.asyncInitChat(messageUpdate)
      this.requestInProgress = true
  
      try {
        // Add user message to chat history only (not to display)
        this.chatHistory.push({ role: "user", content: prompt })
        
        // Start with an empty assistant message
        messageUpdate("assistant", "", true)
  
        let currentMessage = ""
        let usage: CompletionUsage | undefined
  
        const completion = await this.engine.chat.completions.create({
          stream: true,
          messages: this.chatHistory,
          stream_options: { include_usage: true },
        })
  
        for await (const chunk of completion) {
          const contentDelta = chunk.choices[0]?.delta.content
          if (contentDelta) {
            currentMessage += contentDelta
            messageUpdate("assistant", currentMessage, false)
          }
          
          if (chunk.usage) {
            usage = chunk.usage
          }
        }
  
        // Get final message and update chat history
        const finalOutput = await this.engine.getMessage()
        this.chatHistory.push({ role: "assistant", content: finalOutput })
        messageUpdate("assistant", finalOutput, false)
  
        if (usage) {
          const runtimeStats = this.formatRuntimeStats(usage)
          setRuntimeStats(runtimeStats)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        messageUpdate("error", `Generate error: ${errorMessage}`, true)
        console.error("Generation error:", err)
        await this.unloadChat()
      } finally {
        this.requestInProgress = false
      }
    }
  
    private formatRuntimeStats(usage: CompletionUsage): string {
      return [
        `prompt_tokens: ${usage.prompt_tokens}`,
        `completion_tokens: ${usage.completion_tokens}`,
        `prefill: ${usage.extra.prefill_tokens_per_s.toFixed(4)} tokens/sec`,
        `decoding: ${usage.extra.decode_tokens_per_s.toFixed(4)} tokens/sec`
      ].join(', ')
    }
  }
  
  export default ChatUI