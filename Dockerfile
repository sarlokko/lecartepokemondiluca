FROM node:22-alpine

WORKDIR /app

COPY server/package.json ./server/
RUN cd server && npm install --omit=dev

COPY server/index.js ./server/
COPY index.html style.css manifest.json sw.js ui.js notes.js storage.js script.js shiny.js challenges.js battle.js typequiz.js megamax.js exv.js pokemon-list.js pokemon-types.js mega-gmax-list.js ex-v-list.js ./
COPY icons/ ./icons/

ENV PORT=8085
ENV DATA_FILE=/app/data/collection.json
ENV PUBLIC_DIR=/app/server/public

RUN mkdir -p /app/data /app/server/public && \
    mv /app/index.html /app/style.css /app/manifest.json /app/sw.js /app/ui.js /app/notes.js /app/storage.js /app/script.js /app/shiny.js /app/challenges.js /app/battle.js /app/typequiz.js /app/megamax.js /app/exv.js /app/pokemon-list.js /app/pokemon-types.js /app/mega-gmax-list.js /app/ex-v-list.js /app/icons /app/server/public/

EXPOSE 8085

VOLUME ["/app/data"]

CMD ["node", "server/index.js"]
