#!/bin/bash
# Lance Talend Open Studio si l'installateur a été monté dans /installer
set -e
INSTALLER_DIR="/installer"
TALEND_HOME="${TALEND_INSTALL_DIR:-/home/kasm-user/talend-studio}"

if [ -d "$TALEND_HOME" ] && [ -f "$TALEND_HOME/studio" ]; then
  echo "[findme] Talend Studio déjà installé dans $TALEND_HOME"
elif ls "$INSTALLER_DIR"/Talend-Studio-*.tar.xz 1>/dev/null 2>&1; then
  ARCHIVE=$(ls "$INSTALLER_DIR"/Talend-Studio-*.tar.xz | head -1)
  echo "[findme] Extraction de $ARCHIVE …"
  mkdir -p "$TALEND_HOME"
  tar -xJf "$ARCHIVE" -C "$TALEND_HOME" --strip-components=1 2>/dev/null \
    || tar -xJf "$ARCHIVE" -C /tmp/talend-extract
  if [ -d /tmp/talend-extract ]; then
    mv /tmp/talend-extract/* "$TALEND_HOME"/ 2>/dev/null || true
    rm -rf /tmp/talend-extract
  fi
fi

if [ -x "$TALEND_HOME/studio" ]; then
  echo "[findme] Démarrage Talend Open Studio…"
  (cd "${STUDIO_WORKSPACE:-/home/kasm-user/findme-talend}" && "$TALEND_HOME/studio" &) || true
elif [ -f "$TALEND_HOME/Talend-Studio-linux-gtk-x86_64" ]; then
  chmod +x "$TALEND_HOME/Talend-Studio-linux-gtk-x86_64"
  (cd "${STUDIO_WORKSPACE:-/home/kasm-user/findme-talend}" && "$TALEND_HOME/Talend-Studio-linux-gtk-x86_64" &) || true
else
  echo "[findme] Installateur Talend absent. Placez Talend-Studio-*.tar.xz dans bi/talend/studio-docker/installer/"
  echo "[findme] Téléchargement : https://www.talend.com/products/talend-open-studio/"
fi
