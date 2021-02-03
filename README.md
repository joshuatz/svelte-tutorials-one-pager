# Svelte Tutorial - One Pager
> This repo takes all the individual docs that make up the [official Svelte tutorial pages](https://svelte.dev/tutorial/basics), and combines them into one giant single-page document (similar to [the official API docs](https://svelte.dev/docs)).

## How it Works
1. Build command is triggered when it is likely that the Svelte docs have changed
2. Use the Github API to check if the tutorial folder was actually modified since last build (compares SHA)
3. If SHA has changed, and fresh build is needed, uses [`degit` package](https://github.com/Rich-Harris/degit) to shallow clone the site folder from [the official Svelte repo](https://github.com/sveltejs/svelte).
4. Since the contents of the tutorial folder follows a consistent pattern (thanks Svelte team!), it is easy to iterate through contents, extract all the Markdown and meta info, and combine
5. Markdown is converted to HTML, and slightly processed (header links injected, styled slightly, etc.)
6. Static output (HTML + CSS) is ready to serve!

## Development
Clone and install all dependencies, after which you can run `npm run build` to generate a fresh HTML output.

## Thanks
Thank you to Rich Harris and Svelte contributors for crafting a beautiful framework and some really incredible docs!

## TODOs
- Add in the Svelte Apps for each section - at the very least, a code embed or iframe to hosted version.

## About Me
More About Me (Joshua Tzucker):

 - 🔗<a href="https://joshuatz.com/" rel="noopener" target="_blank">joshuatz.com</a>
 - 💬<a href="https://twitter.com/1joshuatz" rel="noopener" target="_blank">@1joshuatz</a>
 - 💾<a href="https://github.com/joshuatz" rel="noopener" target="_blank">github.com/joshuatz</a>