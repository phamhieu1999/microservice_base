FROM haproxy:2.8-alpine

# Copy HAProxy configuration
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

# Expose ports
# 80: Load balancer port
# 8404: Statistics dashboard
EXPOSE 80 8404

# Start HAProxy
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]



