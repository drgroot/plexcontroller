# PlexController

[![GitHub stars](https://img.shields.io/github/stars/drgroot/plexcontroller)](https://github.com/drgroot/plexcontroller/stargazers)

**Description**

PlexController syncs playback status between servers using Postgres and RabbitMQ. When a user starts playing media on one server, the information is written to the Postgres database, and instructions are sent via RabbitMQ to synchronize the playback status. Periodically (using CRON), the controllers will confirm that the playback status on the Plex Server is aligned to the database. When a conflict arises, the database is the winner. 

## Simple Setup

docker-compose.yml
```yaml
version: '3'
services:

  plexServer1:
    container_name: plexServer1
    image: plexinc/pms-docker

  controller1:
    container_name: controller1
    image: yusufali/plexcontroller
    environment:
      # controllers use rabbitmq to send playback information to each other.
      # controllers use postgres to store persistant playback information.
      RABBITMQ_URL: ampq://rabbitmqHost/myVhost
      DATABASE_URL: postgres://user:pass@mypostgresHost:5432/mydatabase

      # specify credentials to log in to plex.tv. It needs to login to plex.tv
      # to get the authTokens for users signed into the server. These authTokens
      # is used to set playback information
      PLEXUSERNAME: myplexusername
      PLEXPASSWORD: myplexpassword

      # configure when daily and monthly tasks are to run. scheduled tasks are to
      # ensure that playback information is synced with playback information stored in
      # the database
      MONTHLY_CRON: '0 2 3 * *'
      DAILY_CRON: '5 4 * * *'
      CRON_TIMEZONE: 'America/Toronto'

      # specify the IP address of the server for this controller to control
      PLEXLOCAL_IP: plexServer1
    links:
      - plexServer1



  plexServer2:
    container_name: plexServer2
    image: plexinc/pms-docker

  controller2:
    container_name: controller2
    image: yusufali/plexcontroller
    environment:
      RABBITMQ_URL: ampq://rabbitmqHost/myVhost
      DATABASE_URL: postgres://user:pass@mypostgresHost:5432/mydatabase
      PLEXUSERNAME: myplexusername
      PLEXPASSWORD: myplexpassword
      MONTHLY_CRON: '0 2 3 * *'
      DAILY_CRON: '5 4 * * *'
      CRON_TIMEZONE: 'America/Toronto'
      PLEXLOCAL_IP: plexServer2
    links:
      - plexServer2
```
