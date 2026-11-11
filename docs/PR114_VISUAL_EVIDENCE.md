# Auth Hero — evidence review PR #114

Đây là chứng cứ lịch sử được khôi phục, không phải ảnh rerun sau remediation. Sáu cặp original before/after giống bytes và decoded pixels; source SHA/build-ID của server lúc chụp không được ghi, do đó exact revision equivalence NOT_VERIFIED.

Settings: Chrome headless; localhost3019/sign-in và /register; networkidle; viewport360/768/1440×900; fullPage; reducedMotion reduce; screenshot animations disabled. Ảnh full-page có thể cao hơn900. Mobile/tablet ẩn hero desktop.

| Route | Width | SHA256 chung của before/after |
|---|---:|---|
| sign-in |360|acd0899e2d46f1e9bcde648d5fe82cc008712792d48e4c2a700d827ee80937a9|
| register |360|a875d42a2ea2984022aef3df179c80e2b1783e320d8f87a7708e10c185bf93f9|
| sign-in |768|de0fabcd76390cc6fc7099f50e42072cac60b232e7784470d357f955ef78b98b|
| register |768|696b7db424356d5c0066292b157872f7a3f7d910b3b6afe1c29283b38adc4a8f|
| sign-in |1440|76633dfcc22f3c0c1822844777666ff4d2e1bf9d0d55273b47965023f19fb7f9|
| register |1440|9974ba055ead2fb418790918fe04e2cc07876f5ba7c59a00a56dbe89cc72c04f|

Original files chưa được gọi là reviewer-accessible cho đến khi native GitHub attachment workflow upload thành công và PR body chứa asset URLs đã kiểm tra. Không commit PNG vào application repository. Không suy luận WCAG, animation runtime hoặc live authenticated UAT từ bộ ảnh này.
