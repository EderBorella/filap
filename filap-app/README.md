# Filap Frontend

React + Vite frontend for the Filap Q&A application.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run generate-api` - Regenerate API client from OpenAPI spec

## API Client Generation

The API client is automatically generated from the backend OpenAPI specification. When the backend API changes, run:

```bash
npm run generate-api
```

This command:
1. Reads the OpenAPI spec from `../filap-api/api_spec.json`
2. Generates TypeScript client code in `./src/api/`
3. Updates all service interfaces and types

**Note**: Always run this command after backend API changes to ensure type safety.
