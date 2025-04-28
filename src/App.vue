<template>
  <router-view />
</template>


<script>
export default {
  created() {
    this.$store.dispatch('auth/checkAuth');
  }
}
</script>


<style>
#app {
  min-height: 98vh;
  /* word-break: break-word; */
  /* text-overflow: ellipsis;
  overflow: hidden; */
  display: flex;
  font-family: Arial, sans-serif;
  flex-direction: column;
  background: #f5f5f5;
  -webkit-font-smoothing: antialiased;
}
.content-area {
  margin-top: 54px;
  margin-left: 180px;
  width: calc(100vw - 180px);
  display: flex;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.tab-content {
  animation: slide-up 0.4s ease;
}
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
