# Modele dashboard Power BI

## Fichier seed

`FindMe_BI_Seed.pbix` = rapport avec visuels (cartes KPI, tableau, graphiques).

## Creer / mettre a jour le modele (eyarh, 1 fois)

Apres avoir finalise le rapport dans Power BI :

```cmd
scripts\save-powerbi-seed.cmd
git add bi/powerbi/template/FindMe_BI_Seed.pbix
git commit -m "chore(bi): modele Power BI avec visuels"
git push
```

## Utilisation (toute l'equipe)

```cmd
ONE_COMMANDE_POWERBI.cmd
```

Copie le seed vers `reports/FindMe_BI_Auto.pbix` si besoin, lance l'ETL, ouvre Power BI.
