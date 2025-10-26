<template>
  <div class="flex flex-col gap-2">
    <div v-for="invite in invites" :key="invite.id">
      <NuxtLink :to="url(invite)" target="_blank" class="p-button block text-center">
        {{ title(invite.use) }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['tournament', 'invites']);

const title = (use) => {
  return use === 'admin' ? 'Management Link' : 'Tournament Link';
}

const url = (invite) => {
  if (invite) {
    switch (invite.use) {
      case 'admin':
        return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''
          }/t/${props.tournament.id}/${invite.id}`;
      default:
        return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''
          }/i/${invite.id}`;
    }
  }
  return '';
}
</script>
