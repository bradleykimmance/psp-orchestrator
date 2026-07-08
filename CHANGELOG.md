# [0.6.0](https://github.com/bradleykimmance/psp-orchestrator/compare/v0.5.0...v0.6.0) (2026-07-08)


### Features

* **worker:** add cloudflare d1 payments DB ([91ac731](https://github.com/bradleykimmance/psp-orchestrator/commit/91ac7313be48ea633ef03f6c56b4bf34763be538))
* **worker:** add vitest cloudflare workers and latest types ([7571bc4](https://github.com/bradleykimmance/psp-orchestrator/commit/7571bc4351b708013e537a4dd77b70fb41be37bd))



# [0.5.0](https://github.com/bradleykimmance/psp-orchestrator/compare/v0.4.0...v0.5.0) (2026-07-02)


### Features

* add idempotency key from browser to psp request ([e418094](https://github.com/bradleykimmance/psp-orchestrator/commit/e418094b977fca6051af872ba34ad6ac24ff5a7d))



# [0.4.0](https://github.com/bradleykimmance/psp-orchestrator/compare/v0.3.1...v0.4.0) (2026-07-02)


### Bug Fixes

* **stripe:** convert stripe to use plain card details ([b6b5bac](https://github.com/bradleykimmance/psp-orchestrator/commit/b6b5bac443434aa72ec78a5c493465a5ab6c303d))


### Features

* **adyen:** add adyen adapter with sandbox card authorisation ([ce73084](https://github.com/bradleykimmance/psp-orchestrator/commit/ce73084f5c16d0f95a0bfba5becbfff2cda9b8b6))
* **shared:** move canonical contract to shared package and add card name ([20c4b4a](https://github.com/bradleykimmance/psp-orchestrator/commit/20c4b4a63bdfc014b17fb7e831573fe93a5e99fb))
* **web:** add adyen only test cards and ensure ui auto updates on psp switch ([09df3c1](https://github.com/bradleykimmance/psp-orchestrator/commit/09df3c1ded7963e767669e3128cdc2b5db3e26a7))



## [0.3.1](https://github.com/bradleykimmance/psp-orchestrator/compare/v0.3.0...v0.3.1) (2026-06-20)


### Bug Fixes

* **web:** show zod specific errors on frontend ([0b8d539](https://github.com/bradleykimmance/psp-orchestrator/commit/0b8d539b2b06bbed7df29f318248904692935868))



# [0.3.0](https://github.com/bradleykimmance/psp-orchestrator/compare/v0.2.0...v0.3.0) (2026-06-20)


### Bug Fixes

* pass error code/message and amount/currency to canonical result ([d02e6bc](https://github.com/bradleykimmance/psp-orchestrator/commit/d02e6bc44e438ed50f94ba379a3ea85ef835cf18))


### Features

* **web:** add amex test card ([1185d49](https://github.com/bradleykimmance/psp-orchestrator/commit/1185d49171f18fe828946e3ffbd2ade0a3f9dbb0))
* **worker:** add stripe auth request with payment method and test suite ([cf15142](https://github.com/bradleykimmance/psp-orchestrator/commit/cf1514243c1e01df31e4071433c9660663141889))



