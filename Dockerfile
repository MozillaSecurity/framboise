FROM taskclusterprivate/fuzzos:latest

LABEL maintainer Christoph Diehl <cdiehl@mozilla.com>

COPY framboise/ framboise

USER root
RUN \
  apt-get update -q \
  && apt-get install -y -q --no-install-recommends --no-install-suggests \
    firefox \
  && apt-get clean -y \
  && apt-get autoclean -y \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/ \
  && rm -rf /root/.cache/* \
  && cd framboise && python3 setup.py \
  && chown -R worker:worker /home/worker

USER worker
ENTRYPOINT ["framboise/xvfb.sh"]
#CMD ["/bin/bash", "--login"]
