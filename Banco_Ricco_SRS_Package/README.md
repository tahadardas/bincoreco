# Banco Ricco — SRS Modular Package

هذه الحزمة هي وثيقة متطلبات نظام كاملة ومجزأة إلى ملفات مستقلة، بحيث يمكن وضعها داخل مجلد المشروع والرجوع إليها أثناء التصميم والبرمجة.

## أين توضع الحزمة؟

```txt
project-root/
  docs/
    Banco_Ricco_SRS_Package/
      README.md
      00_overview/
      01_roadmap/
      02_brand_design/
      03_architecture/
      04_features/
      05_database/
      06_api_contracts/
      07_ux_flows/
      08_admin_dashboard/
      09_prompts/
      10_acceptance_tests/
  assets/
    brand/
      Banco Ricco Final Logo Big.pdf
      BR Banco Ricco Final Logo.pdf
```

## توجيه إلزامي للوغو

يجب وضع ملفات اللوغو بصيغة PDF داخل:

```txt
assets/brand/
```

وعلى المصمم أو وكيل البرمجة أن يستأنس منها في:

- الألوان: أسود، ذهبي، أبيض/كريمي، وبني قهوي.
- الإحساس العام: فاخر، دمشقي، كلاسيكي، مع لمسة حديثة.
- استخدام الشعار الكامل للصفحات الرسمية والموقع والمطبوعات.
- استخدام شعار BR المختصر للأيقونة، Splash، QR Card، وواجهة التطبيق.
- عدم بناء تصميم يشبه قالب مطعم عام.

## طريقة العمل

كل ميزة لها ملف مستقل داخل:

```txt
04_features/
```

أي تعديل أو تطوير يجب أن يبدأ من ملف الميزة المعنية، ثم يتم تحديث قاعدة البيانات وواجهات API ورحلات المستخدم عند اللزوم.
