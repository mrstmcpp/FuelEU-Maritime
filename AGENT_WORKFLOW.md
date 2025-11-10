# AI Agent Workflow Log

## Agents Used
- **ChatGPT** - Used for understanding and asking best practices which should be followed, also code refractoring and alternatives. Assisted in refactoring Prisma schema and writing ts entity models.
- **Github Copilot** - Inline completions and suggestions during writing code.
- **Cursor IDE Agent** - Used generally for file refractorings.


### Prompts 
**Prompts Used**
- **Cursor IDE AGENT** - `setup a basic backend inside `src/infrastructure/server` with nodejs and typescript + progresql prisma backed also ensure hexagonal archi from given image. `
![InitialSetup](https://i.postimg.cc/VktxQkv6/Screenshot-2025-11-10-094923.png)
- **Cursor IDE AGENT** - `use provided image as db schema . `
![db schema setup](https://i.postimg.cc/t4r2c0tg/Screenshot-2025-11-10-095454.png)
- **ChatGPT** - Provided schema.ts & instructed to `use ship as a entity and reference others tables from that ShipId as FK. also use decimal instead of float ` 
[![image.png](https://i.postimg.cc/JhZHkZhN/image.png)](https://postimg.cc/HJWLGJXn)

