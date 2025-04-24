<template>
  <div class="login-page">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email" required>
      </div>
      
      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="password" type="password" required>
      </div>

      <div class="auth-links">
        <button type="submit" class="login-btn">Войти</button>
        <router-link to="/register" class="register-link">
          Или зарегистрироваться
        </router-link>
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script>
export default {
  created() {
    if (this.$store.state.auth.user) {
      this.$router.push('/')
    }
  },
  data() {
    return {
      email: 'admin@example.com',
      password: 'admin123',
      loading: false,
      error: null
    }
  },
  methods: {
    async handleSubmit() {
      // Проверка email в начале
      if (!/^\S+@\S+\.\S+$/.test(this.email)) {
        this.error = 'Некорректный email';
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        await this.$store.dispatch('auth/login', {
          email: this.email,
          password: this.password
        });
        this.$router.push('/'); // Перенаправление после успеха
      } catch (err) {
        this.error = err.message; // Вывод ошибки "Неверные учетные данные"
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

  <style scoped>
  .login-page {
    max-width: 400px;
    margin: 2rem auto;
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  input {
    width: 100%;
    padding: 8px;
    margin-top: 4px;
  }
  .auth-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.login-btn {
  background: #2196F3;
  color: white;
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.register-link {
  text-align: center;
  color: #2196F3;
  text-decoration: none;
  font-size: 0.9rem;
}

.register-link:hover {
  text-decoration: underline;
}
  </style>