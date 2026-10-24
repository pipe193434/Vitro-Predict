# Vitro-Predict · Demo de despliegue

Sitio estático para GitHub Pages que ejecuta en el navegador el Random Forest final sobre dos registros anonimizados del conjunto de prueba reservado.

## Evidencia

- Modelo: Random Forest de 100 árboles.
- Umbral: 0,38, seleccionado con predicciones fuera de fold y costo FN:FP de 5:1.
- Caso A: verdadero positivo del test reservado.
- Caso B: verdadero negativo del test reservado.
- La implementación JavaScript recorre los árboles exportados y compara la probabilidad con la obtenida en scikit-learn.
- No se publican nombres de clientes ni textos libres corporativos.

## Regeneración

Desde la raíz del proyecto:

```bash
python github_pages_demo/exportar_demo.py
```

Después se publican `index.html`, `styles.css`, `app.js` y `model_bundle.json` mediante GitHub Pages.
