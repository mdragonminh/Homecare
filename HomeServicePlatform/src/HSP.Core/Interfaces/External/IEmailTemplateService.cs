namespace HSP.Core.Interfaces.External
{
	public interface IEmailTemplateService
	{
		Task<string> RenderAsync<TModel>(string viewPath, TModel model);
	}
}
