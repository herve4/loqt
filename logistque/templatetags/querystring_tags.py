from django import template

register = template.Library()

@register.simple_tag(takes_context=True)
def querystring(context, **kwargs):
    """
    Construit une chaîne de requête conservant les paramètres existants,
    et ajoutant/modifiant ceux passés dans kwargs.
    """
    request = context['request']
    query = request.GET.copy()
    for key, value in kwargs.items():
        query[key] = value
    return query.urlencode()



@register.filter(name='get_item')
def get_item(dictionary, key):
    return dictionary.get(key, '')


@register.filter(name='multiply')
def multiply(value, arg):
    """Multiplier une valeur par un argument"""
    return value * arg
