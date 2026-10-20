FROM node:26-alpine AS frontend-builder
WORKDIR /app
COPY . ./
RUN npm i --force
RUN npm run build

FROM rust:slim-bookworm AS tauri-builder
WORKDIR /app
COPY --from=frontend-builder /app /app
RUN apt update && apt install -y --no-install-recommends libwebkit2gtk-4.1-dev \
                                                         build-essential \
                                                         curl \
                                                         wget \
                                                         file \
                                                         libxdo-dev \
                                                         libssl-dev \
                                                         libayatana-appindicator3-dev \
                                                         librsvg2-dev
WORKDIR /app/src-tauri
RUN cargo install tauri-cli --locked
RUN cargo tauri build  --config '{"build":{"beforeBuildCommand":null}}'


FROM scratch AS export
COPY --from=tauri-builder /app/src-tauri/target/release/bundle /bundle