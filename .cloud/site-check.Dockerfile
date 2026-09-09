FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
COPY site/dist/ /usr/share/nginx/html/
COPY .cloud/nginx.conf /etc/nginx/conf.d/default.conf
COPY scripts/check-static-http.sh /tmp/check-static-http.sh
RUN nginx && sh /tmp/check-static-http.sh; result=$?; nginx -s quit; exit $result
