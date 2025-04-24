<template>
    <div class="register">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Имя:</label>
        <input v-model="form.name" required>
      </div>

      <div class="form-group">
        <label>Email:</label>
        <input v-model="form.email" type="email" required>
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="form.password" type="password" required>
      </div>

      <button type="submit">Зарегистрироваться</button>
      <div v-if="error" class="error">{{ error }}</div>
    </form>
  </div>
  </template>
  
  <script>
  export default {
    data() {
    return {
      form: {
        name: '',
        email: '',
        password: ''
      },
      error: null
    }
    },
    methods: {
      async handleSubmit() {
        try {
          await this.$store.dispatch('auth/register', this.form);
          this.$router.push('/');
        } catch (err) {
          this.error = err.message || 'Ошибка регистрации';
        }
      }
    }
  }
  </script>