<template>
  <router-view />
</template>


<script>
export default {
}
</script>


<style>
.scrollable-container {
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #888 #f0f0f0;
  z-index: 100;
}

.scrollable-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollable-container::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.scrollable-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.scrollable-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
#app {
  min-height: 98vh;
  color: #2c3e50;
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
  height: calc(100vh - 72px);
  /* width: calc(100vw - 180px); */
  margin-left: 180px;
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
p {
  margin: 0;
}

</style>
