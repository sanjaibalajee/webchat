
# WebChat

WebChat is a real-time chat application built with Next.js 15, utilizing WebGPU to run Large Language Models (LLMs) directly in the browser via [WebLLM](https://github.com/mlc-ai/web-llm) from MLC.

## Getting Started

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/sanjaibalajee/webchat.git
   cd webchat
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Run the Development Server**:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Deployment

To deploy the application for production:

1. **Build the Application**:

   ```bash
   npm run build
   ```

2. **Start the Production Server**:

   ```bash
   npm start
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

## Acknowledgements

This project utilizes [WebLLM](https://github.com/mlc-ai/web-llm) from MLC to enable in-browser execution of Large Language Models.
