# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_STEP_API_KEY
ARG REACT_APP_REALTIME_ENDPOINT
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_STEP_API_KEY=$REACT_APP_STEP_API_KEY
ENV REACT_APP_REALTIME_ENDPOINT=$REACT_APP_REALTIME_ENDPOINT

RUN npm run build

# Serve stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
