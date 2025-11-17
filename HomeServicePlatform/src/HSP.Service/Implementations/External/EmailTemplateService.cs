using HSP.Core.Interfaces.External;
using Razor.Templating.Core;

namespace HSP.Service.Implementations.External
{
	public class EmailTemplateService : IEmailTemplateService
	{
		public async Task<string> RenderAsync<TModel>(string viewPath, TModel model)
		{
			return await RazorTemplateEngine.RenderAsync(viewPath, model);
		}
	}
}
