# Talend Open Studio — bureau Linux + accès navigateur (noVNC / Kasm)
FROM kasmweb/desktop:1.14.0

USER root

# JRE headless en priorite (plus leger, miroirs apt plus fiables que openjdk-17-jdk seul)
RUN set -eux; \
    rm -f /etc/apt/sources.list.d/google-chrome.list 2>/dev/null || true; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        wget ca-certificates fonts-dejavu; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        openjdk-17-jre-headless \
        || DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openjdk-17-jdk; \
    rm -rf /var/lib/apt/lists/*

COPY studio-docker/startup-talend.sh /dockerstartup/custom_user_startup.sh
RUN chmod +x /dockerstartup/custom_user_startup.sh

COPY studio/FindMe_Load_DW /home/kasm-user/findme-talend/FindMe_Load_DW
RUN chown -R 1000:1000 /home/kasm-user/findme-talend

USER 1000

ENV TALEND_INSTALL_DIR=/home/kasm-user/talend-studio
ENV STUDIO_WORKSPACE=/home/kasm-user/findme-talend
