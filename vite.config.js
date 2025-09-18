@@ .. @@
 import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
import * as path from 'path'
+import { fileURLToPath } from 'url'
+import { dirname } from 'path'
+
+const __filename = fileURLToPath(import.meta.url)
 
 // https://vite.dev/config/
const __dirname = path.dirname(__filename)
 }
 )