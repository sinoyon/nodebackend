### How to manage AWS SES templates
1. Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
2. Run `aws configure`, specifiy your credentials, specifiy region as `eu-central-1`
3. Get all templates: `aws ses list-templates`
4. Get a template: `aws ses get-template --template-name <TEMPLATE_NAME>`
5. Create a template: `aws ses create-template --cli-input-json file://<FILE_NAME>.json`. See [here](https://docs.aws.amazon.com/cli/latest/reference/ses/create-template.html) for JSON format.
6. Update a template: `aws ses update-template --cli-input-json file://<FILE_NAME>.json`. Same JSON format as above.
7. Delete a template: `aws ses delete-template --template-name <TEMPLATE_NAME>`