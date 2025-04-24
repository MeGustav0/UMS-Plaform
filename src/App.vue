<template>
  <router-view />
</template>


<script>
export default {
  created() {
    // Замените старую проверку
    this.$store.dispatch('auth/checkAuth');
  }
}
</script>


<style>
#app {
  min-height: 100vh;
  display: flex;
  font-family: Arial, sans-serif;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
}

/* Стили для контентной области */
.content-area {
  margin-top: 54px;
  margin-left: 180px;
  width: 100%;
  display: flex;
  padding: 25px;
}

/* Анимации */
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
