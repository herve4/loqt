#!/bin/sh
until pg_isready -h db -p 5432; do
  echo "En attente de PostgreSQL..."
  sleep 2
done